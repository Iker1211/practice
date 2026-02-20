import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Code,
} from "@repo/ui";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-foreground">
          Component Showcase
        </h1>

        {/* Card */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Card</h2>
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>
                This is a description for the card.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                This is the main content area of the card. You can put any
                React nodes here.
              </p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>
        </div>

        {/* Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        {/* Input */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-primary">Input</h2>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="email">Email</label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
        </div>

        {/* Code */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-primary">Code</h2>
          <div className="bg-muted p-4 rounded-md">
            <Code>
              {`import { Button } from "@repo/ui";

function MyComponent() {
  return <Button>Click me</Button>
}`}
            </Code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
