'use client';

import { TokenSUI, TokenUSDC, TokenUSDT } from '@web3icons/react';

interface TokenIconProps {
  symbol: string;
  size?: number;
  className?: string;
}

export function TokenIcon({ symbol, size = 24, className }: TokenIconProps) {
  const props = { size, className };

  switch (symbol) {
    case 'SUI':
      return <TokenSUI {...props} variant="branded" />;
    case 'USDC':
      return <TokenUSDC {...props} variant="branded" />;
    case 'USDT':
      return <TokenUSDT {...props} variant="branded" />;
    default:
      return (
        <div
          className={`rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 ${className}`}
          style={{ width: size, height: size }}
        >
          {symbol.slice(0, 2)}
        </div>
      );
  }
}
