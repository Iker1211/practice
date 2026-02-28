import {
  Button,
} from "@myapp/ui";
import { useIdeas } from "./useIdeas";

function App() {
  const { ideas, loading, create, remove } = useIdeas();

  const handleCreateIdea = async () => {
    await create("Nueva idea " + Date.now());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">
          Ideas App - Supabase Demo
        </h1>

        <Button onClick={handleCreateIdea} className="mb-4">
          Crear Idea
        </Button>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <ul className="space-y-2">
            {ideas.map((idea) => (
              <li key={idea.id} className="flex items-center gap-2">
                <span>{idea.title}</span>
                <Button
                  onClick={() => remove(idea.id)}
                  variant="destructive"
                  size="sm"
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
