'use client';

interface UseCaseCardProps {
  icon: string;
  title: string;
  description: string;
  examples: string[];
}

function UseCaseCard({ icon, title, description, examples }: UseCaseCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-cyan-500/30 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
      <div className="flex flex-wrap gap-2">
        {examples.map((example, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
          >
            {example}
          </span>
        ))}
      </div>
    </div>
  );
}

export function UseCasesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-4">
          One protocol, endless possibilities
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-center mb-16 max-w-2xl mx-auto">
          From simple polls to complex governance — configure campaigns for any coordination need.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <UseCaseCard
            icon="🗳️"
            title="Voting & Governance"
            description="DAO proposals, elections, community decisions with transparent results"
            examples={['Board elections', 'Budget allocation', 'Policy votes']}
          />
          <UseCaseCard
            icon="📊"
            title="Surveys & Feedback"
            description="Collect verified responses with permanent audit trail"
            examples={['Course feedback', 'Market research', 'Employee surveys']}
          />
          <UseCaseCard
            icon="📝"
            title="Registration"
            description="Event signups, waitlists, membership applications"
            examples={['Conference RSVP', 'Course enrollment', 'Waitlists']}
          />
          <UseCaseCard
            icon="🏆"
            title="Competitions"
            description="Contests with fair judging and transparent prize distribution"
            examples={['Hackathons', 'Design contests', 'Grant programs']}
          />
          <UseCaseCard
            icon="📜"
            title="Certification"
            description="Tests and assessments with verifiable credentials"
            examples={['Skill tests', 'Compliance checks', 'Certifications']}
          />
          <UseCaseCard
            icon="💰"
            title="Crowdfunding"
            description="Fundraising with milestone tracking and automatic refunds"
            examples={['Project funding', 'Charity drives', 'Pre-orders']}
          />
        </div>
      </div>
    </section>
  );
}
