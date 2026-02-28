"use client"

import { useIdeas } from "./useIdeas"

export default function Home() {
  const { ideas, loading, create, remove } = useIdeas()

  const handleCreateIdea = async () => {
    await create("Nueva idea " + Date.now())
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">
          Ideas App
        </h1>

        <button
          onClick={handleCreateIdea}
          className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Idea
        </button>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading ideas...</p>
        ) : ideas.length === 0 ? (
          <p className="text-center text-muted-foreground">No ideas yet. Create your first one!</p>
        ) : (
          <ul className="space-y-3">
            {ideas.map((idea) => (
              <li
                key={idea.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <span className="text-foreground">{idea.title}</span>
                <button
                  onClick={() => remove(idea.id)}
                  className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
