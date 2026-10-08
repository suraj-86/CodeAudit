import { Link } from 'react-router'
import { RenameTestDemo } from '../components/RenameTestDemo'
import { Section } from '../components/Section'
import { buttonClasses } from '../components/ui/button-styles'

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="border-2 border-ink bg-sheet p-6 shadow-block sm:p-10">
        <p className="mb-2 inline-block border-2 border-ink bg-marigold px-2 py-0.5 font-mono text-[0.8rem] font-bold">
          exact match · structure · behaviour · AI signal
        </p>
        <h1 className="font-display text-3xl leading-tight font-bold sm:text-4xl">
          Is it really the same program?
        </h1>
        <p className="mt-3 max-w-prose text-lg text-ink-soft">
          CodeAudit checks submitted code from a few independent angles — identical bytes, matching
          structure, matching behaviour, and an AI-style indicator — and shows each one on its own.
          It never collapses them into a single verdict; a person still decides.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/check" className={buttonClasses('primary')}>
            Check two files
          </Link>
          <Link to="/batch" className={buttonClasses('secondary')}>
            Check a class set
          </Link>
        </div>
      </section>

      <RenameTestDemo />

      <Section
        title="One score would hide too much"
        description="Each check answers a different question. CodeAudit keeps them visibly separate, on purpose."
      >
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="font-semibold">Exact match</dt>
            <dd className="text-ink-soft">Are the two files identical, byte for byte?</dd>
          </div>
          <div>
            <dt className="font-semibold">Structure</dt>
            <dd className="text-ink-soft">
              Same skeleton once names, formatting and comments are stripped away.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">Behaviour</dt>
            <dd className="text-ink-soft">
              Does it produce the expected output for real test cases? — currently for Python.
            </dd>
          </div>
          <div>
            <dt className="font-semibold">AI-assisted signal</dt>
            <dd className="text-ink-soft">
              A rough, separate indicator of AI-style patterns. Never proof of who wrote the code.
            </dd>
          </div>
        </dl>
      </Section>
    </div>
  )
}
