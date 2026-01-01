'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import Link from 'next/link';
import { getFormById, Form } from '@/lib/sui';
import { PACKAGE_ID, ACCESS_TYPES, AUTH_METHODS } from '@/lib/config';

export default function FormPage() {
  const params = useParams();
  const formId = params.id as string;
  
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingResponse, setCheckingResponse] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Проверяем zkLogin
  const [zkAddress, setZkAddress] = useState<string | null>(null);
  const [zkEmail, setZkEmail] = useState<string | null>(null);
  
  useEffect(() => {
    const savedZk = localStorage.getItem('zklogin_address');
    const savedEmail = localStorage.getItem('zklogin_email');
    if (savedZk) {
      setZkAddress(savedZk);
      setZkEmail(savedEmail);
    }
  }, []);

  const isAuthenticated = currentAccount || zkAddress;
  const userAddress = currentAccount?.address || zkAddress;

  useEffect(() => {
    loadForm();
  }, [formId, userAddress]);

  const loadForm = async () => {
    setLoading(true);
    const data = await getFormById(suiClient, formId);
    setForm(data);
    
    if (data && userAddress) {
      await checkIfUserResponded();
    }
    
    setLoading(false);
  };

  const checkIfUserResponded = async () => {
    if (!userAddress) return;
    
    setCheckingResponse(true);
    
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::logbook::has_participated`,
        arguments: [
          tx.object(formId),
          tx.pure.address(userAddress),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        sender: userAddress,
        transactionBlock: tx,
      });

      if (result.results?.[0]?.returnValues?.[0]?.[0]?.[0] === 1) {
        setHasResponded(true);
        setShowResults(true);
      } else {
        setHasResponded(false);
      }
    } catch (error) {
      console.error('Error checking response status:', error);
      setHasResponded(false);
    }
    
    setCheckingResponse(false);
  };

  const handleSubmit = async () => {
    if (selectedOption === null) {
      alert('Please select an option');
      return;
    }

    if (!isAuthenticated) {
      alert('Please connect your wallet or sign in with Google');
      return;
    }

    if (hasResponded) {
      alert('You have already responded to this form!');
      return;
    }

    // Проверяем есть ли Sui Wallet для транзакции
    if (!currentAccount) {
      alert('zkLogin transactions require sponsored gas. For now, please connect a Sui Wallet to vote.\n\nSponsored transactions coming soon!');
      return;
    }

    setIsSubmitting(true);

    try {
      const tx = new Transaction();

      tx.moveCall({
        target: `${PACKAGE_ID}::logbook::submit_response`,
        arguments: [
          tx.object(formId),
          tx.pure.u64(selectedOption),
        ],
      });

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: () => {
            alert('Response submitted successfully! ✓');
            setHasResponded(true);
            setShowResults(true);
            loadForm();
            setIsSubmitting(false);
          },
          onError: (error) => {
            console.error('Error submitting:', error);
            
            const errorMsg = error.message || '';
            if (errorMsg.includes(', 0)') || errorMsg.includes('EAlreadyParticipated')) {
              alert('You have already responded to this form!');
              setHasResponded(true);
              setShowResults(true);
              loadForm();
            } else if (errorMsg.includes('ENotWhitelisted')) {
              alert('You are not authorized to respond to this form.');
            } else {
              alert('Failed to submit response. Please try again.');
            }
            
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit response');
      setIsSubmitting(false);
    }
  };

  if (loading || checkingResponse) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            {checkingResponse ? 'Checking response status...' : 'Loading form...'}
          </div>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Form not found</p>
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const totalResponses = form.votes.reduce((sum, votes) => sum + parseInt(votes), 0);

  const getAccessTypeLabel = () => {
    switch(form.accessType) {
      case ACCESS_TYPES.PUBLIC: return 'Public';
      case ACCESS_TYPES.LINK: return 'Link Only';
      case ACCESS_TYPES.WHITELIST: return 'Restricted';
      default: return 'Unknown';
    }
  };

  const getAuthMethodLabel = () => {
    switch(form.authMethod) {
      case AUTH_METHODS.SUI_WALLET: return 'Sui Wallet';
      case AUTH_METHODS.ZKLOGIN: return 'zkLogin';
      case AUTH_METHODS.BOTH: return 'Sui Wallet or zkLogin';
      default: return 'Unknown';
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to Forms
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {form.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {form.description}
          </p>

          <div className="flex gap-4 mb-6 text-sm flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              {getAccessTypeLabel()}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">
              {getAuthMethodLabel()}
            </span>
            {zkAddress && !currentAccount && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                Signed in: {zkEmail || 'zkLogin'}
              </span>
            )}
          </div>

          {hasResponded && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ You have already responded to this form
              </p>
            </div>
          )}

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                Total responses: {totalResponses}
              </p>
              {!hasResponded && !showResults && isAuthenticated && (
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showResults ? 'Hide results' : 'Show results'}
                </button>
              )}
            </div>

            {!hasResponded && !showResults && isAuthenticated ? (
              <div className="space-y-3">
                <p className="font-medium text-gray-700 mb-3">Select your choice:</p>
                {form.options.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                    style={{
                      borderColor: selectedOption === index ? '#3B82F6' : '#E5E7EB',
                    }}
                  >
                    <input
                      type="radio"
                      name="form-option"
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                      className="mr-3"
                      disabled={isSubmitting}
                    />
                    <span className="flex-1 font-medium">{option}</span>
                  </label>
                ))}

                {zkAddress && !currentAccount && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ zkLogin voting requires a Sui Wallet for now. Sponsored transactions coming soon!
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedOption === null || (zkAddress && !currentAccount)}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="font-medium text-gray-700 mb-3">Results:</p>
                {form.options.map((option, index) => {
                  const votes = parseInt(form.votes[index]);
                  const percentage = totalResponses > 0 ? (votes / totalResponses) * 100 : 0;

                  return (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{option}</span>
                        <span className="text-gray-600">
                          {votes} responses ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!isAuthenticated && (
            <div className="text-center py-8 border-t">
              <p className="text-gray-600 mb-4">
                Sign in to respond to this form
              </p>
              <Link href="/" className="text-blue-600 hover:text-blue-700">
                ← Go to Home Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
