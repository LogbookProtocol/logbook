'use client';

interface ProblemCardProps {
  icon: string;
  title: string;
  description: string;
}

function ProblemCard({ icon, title, description }: ProblemCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

export function ProblemSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-16">
          Coordination is broken
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <ProblemCard
            icon="🗑️"
            title="Mutable records"
            description="Votes in Google Forms can be edited. Databases can be wiped. History gets rewritten."
          />
          <ProblemCard
            icon="🔒"
            title="No transparency"
            description="Who voted? Were results manipulated? You have to trust the organizer."
          />
          <ProblemCard
            icon="💨"
            title="Lost forever"
            description="Surveys closed, data deleted, decisions forgotten. No permanent record."
          />
        </div>
      </div>
    </section>
  );
}
