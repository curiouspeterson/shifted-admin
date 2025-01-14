import Test from './test'
import TestMinimal from './test-minimal'

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        Test Page
      </h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">NextUI Test</h2>
          <Test />
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-4">Basic Tailwind Test</h2>
          <TestMinimal />
        </section>
      </div>
    </div>
  )
}
