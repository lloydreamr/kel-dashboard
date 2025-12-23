'use client';

import { Archive } from 'lucide-react';
import { useState } from 'react';

import { ArchivedQuestionsList } from '@/components/questions/ArchivedQuestionsList';
import { QuestionForm } from '@/components/questions/QuestionForm';
import { QuestionsList } from '@/components/questions/QuestionsList';
import { Button } from '@/components/ui/button';

interface QuestionsPageClientProps {
  userId: string;
}

/**
 * Client component for the questions page.
 * Handles state for showing/hiding the create form and archived view.
 */
export function QuestionsPageClient({ userId }: QuestionsPageClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const handleNewQuestion = () => {
    setShowForm(true);
    setShowArchived(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  const toggleArchived = () => {
    setShowArchived(!showArchived);
    setShowForm(false);
  };

  return (
    <main
      data-testid="questions-page"
      className="min-h-screen bg-background px-4 py-6"
    >
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">
            {showArchived ? 'Archived Questions' : 'Strategic Questions'}
          </h1>
          {!showForm && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleArchived}
                data-testid="view-archived-button"
                className="text-muted-foreground"
              >
                <Archive className="h-4 w-4 mr-2" />
                {showArchived ? 'Active' : 'Archived'}
              </Button>
              {!showArchived && (
                <button
                  type="button"
                  onClick={handleNewQuestion}
                  data-testid="new-question-button"
                  className="min-h-[48px] rounded-md bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  New Question
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-medium text-foreground">
              Create New Question
            </h2>
            <QuestionForm userId={userId} onCancel={handleFormCancel} />
          </div>
        )}

        {/* Questions List or Archived List */}
        {!showForm && (showArchived ? <ArchivedQuestionsList /> : <QuestionsList />)}
      </div>
    </main>
  );
}
