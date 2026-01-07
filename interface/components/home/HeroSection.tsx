'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingBlocks } from '@/components/FloatingBlocks';
import { useAuth } from '@/contexts/AuthContext';
import { saveReferrer } from '@/lib/navigation';
import { useDevice } from '@/hooks/useDevice';

export function HeroSection() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const { isMobile } = useDevice();
  const [showTagline, setShowTagline] = useState(false);

  return (
    <section
      className="flex items-center justify-center relative overflow-visible"
      style={{ minHeight: isMobile ? 'calc(100svh - 56px - 28px - 64px)' : 'calc(100vh - 56px - 28px)' }}
    >
      <FloatingBlocks />

      <div className="relative z-10 text-center max-w-4xl px-6">
        {/* Built on Sui badge */}
        <div className="flex justify-center mb-6">
          <a
            href="https://sui.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20 transition"
          >
            Built on
            <svg className="w-3 h-3.5" viewBox="0 0 29 36" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M22.5363 15.0142L22.5357 15.0158C24.0044 16.8574 24.8821 19.1898 24.8821 21.7268C24.8821 24.3014 23.9781 26.6655 22.4698 28.5196L22.3399 28.6792L22.3055 28.4763C22.2762 28.3038 22.2418 28.1296 22.2018 27.954C21.447 24.6374 18.9876 21.7934 14.9397 19.4907C12.2063 17.9399 10.6417 16.0727 10.2309 13.9511C9.96558 12.5792 10.1628 11.2012 10.544 10.0209C10.9251 8.84103 11.4919 7.85247 11.9735 7.2573L11.9738 7.25692L13.5484 5.3315C13.8246 4.99384 14.3413 4.99384 14.6175 5.3315L22.5363 15.0142ZM25.0269 13.0906L25.0272 13.0898L14.4731 0.184802C14.2715 -0.0616007 13.8943 -0.0616009 13.6928 0.184802L3.1385 13.09L3.13878 13.0907L3.10444 13.1333C1.16226 15.5434 0 18.6061 0 21.9402C0 29.7051 6.30498 36 14.0829 36C21.8608 36 28.1658 29.7051 28.1658 21.9402C28.1658 18.6062 27.0035 15.5434 25.0614 13.1333L25.0269 13.0906ZM5.66381 14.9727L5.66423 14.9721L6.60825 13.8178L6.63678 14.0309C6.65938 14.1997 6.68678 14.3694 6.71928 14.5398C7.33009 17.7446 9.51208 20.4169 13.1602 22.4865C16.3312 24.2912 18.1775 26.3666 18.7095 28.6427C18.9314 29.5926 18.971 30.5272 18.8749 31.3443L18.8689 31.3948L18.8232 31.4172C17.3919 32.1164 15.783 32.5088 14.0826 32.5088C8.11832 32.5088 3.28308 27.6817 3.28308 21.7268C3.28308 19.1701 4.17443 16.8208 5.66381 14.9727Z" />
            </svg>
            Sui
          </a>
        </div>
        <div
          className="font-bold mb-8 tracking-tight leading-[1.05] select-none cursor-pointer relative"
          style={{ fontSize: 'clamp(4.25rem, 10vw, 8rem)' }}
          onClick={() => setShowTagline(!showTagline)}
        >
          {/* Invisible spacer for height */}
          <div className="invisible" aria-hidden="true">
            <span className="block">Verifiable.</span>
            <span className="block">Logbook</span>
            <span className="block">Permanent.</span>
          </div>
          {/* Verifiable - gray version */}
          <span
            className={`absolute left-0 right-0 text-center text-gray-100 dark:text-gray-900 ${showTagline ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: 0 }}
          >
            Verifiable.
          </span>
          {/* Verifiable - gradient version */}
          <span
            className={`absolute left-0 right-0 text-center bg-gradient-to-b from-cyan-400 to-blue-500 bg-clip-text text-transparent ${showTagline ? 'opacity-100' : 'opacity-0'}`}
            style={{ top: 0 }}
          >
            Verifiable.
          </span>
          {/* Permanent - MUST be before Logbook in DOM so Logbook renders on top */}
          <span
            className={`absolute left-0 right-0 text-center text-gray-100 dark:text-gray-900 ${showTagline ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: 'calc(1.05em * 2)' }}
          >
            Permanent.
          </span>
          {/* Logbook - last so it renders on top */}
          <span
            className={`absolute left-0 right-0 text-center bg-gradient-to-b from-cyan-400 to-blue-500 bg-clip-text text-transparent ${showTagline ? 'opacity-0' : 'opacity-100'}`}
            style={{ top: '1.05em', paddingBottom: '0.15em', marginBottom: '-0.15em' }}
          >
            Logbook
          </span>

          {/* Gradient group: Verifiable / Immutable / Permanent - shared gradient */}
          <div className={`absolute inset-0 bg-gradient-to-b from-cyan-400 to-blue-500 bg-clip-text ${showTagline ? 'opacity-100' : 'opacity-0'}`}>
            <span className="block text-transparent">Verifiable.</span>
            <span className="block text-transparent">Immutable.</span>
            <span className="block text-transparent">Permanent.</span>
          </div>
        </div>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-[420px] mx-auto leading-relaxed">
          Coordination platform for voting, surveys, and collective decisions - all recorded on-chain.
        </p>

        <button
          onClick={() => {
            const targetPath = '/campaigns/new';
            if (requireAuth(targetPath)) {
              saveReferrer(targetPath);
              router.push(targetPath);
            }
          }}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
        >
          Create Campaign
        </button>
      </div>

    </section>
  );
}
