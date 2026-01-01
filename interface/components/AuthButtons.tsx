'use client';

import { WalletButton } from './WalletButton';
import { ZkLoginButton } from './ZkLoginButton';

export function AuthButtons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ZkLoginButton />
      <WalletButton />
    </div>
  );
}
