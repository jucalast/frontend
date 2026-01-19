import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { query, maxResults = 8, maxPages = 3, maxSentences = 5, noGroq = false, verbose = false } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query parameter is required and must be a string' }, { status: 400 })
    }

    const pythonCmd = 'python'
    const scriptPath = '-c'
    const scriptContent = `
import sys
import io
sys.path.insert(0, '../backend/src')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from search_summarizer.cli import main
sys.argv = ['search_summarizer.cli', '${query}', '--max-results', '${maxResults}', '--max-pages', '${maxPages}', '--max-sentences', '${maxSentences}'${noGroq ? ' --no-groq' : ''}${verbose ? ' --verbose' : ''}]
main()
`
    console.log('Spawning backend inline script:', scriptContent)

    const { spawn } = await import('child_process')
    const child = spawn(pythonCmd, [scriptPath, scriptContent], {
      cwd: '../backend',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    const result = await new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve, reject) => {
      child.on('close', (code) => {
        resolve({ stdout, stderr, code })
      })
      child.on('error', reject)
    })

    console.log('Backend script raw:', { stdout, stderr, code: result.code })
    if (result.code !== 0) {
      console.error('Backend script error:', result.stderr)
      return NextResponse.json({ error: 'Backend script failed', details: result.stderr }, { status: 500 })
    }

    const lines = result.stdout.split('\n')
    const summaryStart = lines.findIndex(line => line.includes('--- Resumo ---'))
    const sourcesStart = lines.findIndex(line => line.includes('Fontes utilizadas:'))

    const summary = summaryStart !== -1 && sourcesStart !== -1
      ? lines.slice(summaryStart + 1, sourcesStart).join('\n').trim()
      : summaryStart !== -1
      ? lines.slice(summaryStart + 1).join('\n').trim()
      : ''

    const sources = sourcesStart !== -1
      ? lines.slice(sourcesStart + 1).filter(line => line.trim().startsWith('http'))
      : []

    // Extract URLs from stderr (INFO lines) as fallback if no sources listed
    let fallbackSources: string[] = []
    if (sources.length === 0) {
      const urlRegex = /https?:\/\/[^\s]+/g
      fallbackSources = result.stderr.match(urlRegex) || []
    }

    const cleanSummary = summary
    const cleanSources = sources.length > 0 ? sources : fallbackSources

    console.log('API route parsed:', { summary: cleanSummary, sources: cleanSources, rawOutput: result.stdout })
    return NextResponse.json({ summary: cleanSummary, sources: cleanSources, rawOutput: result.stdout })
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
