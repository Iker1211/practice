import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@repo/ui";

function App() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Welcome back! Please enter your details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="email">Email</label>
                <Input id="email" placeholder="user@example.com" />
              </div>
              <div className="flex flex-col space-y-1.5">
                <label htmlFor="password">Password</label>
                <Input id="password" type="password" />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full">Sign In</Button>
          <Button variant="outline" className="w-full">
            Sign in with Google
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default App;
