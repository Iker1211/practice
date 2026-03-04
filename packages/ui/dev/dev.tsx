import React from 'react'
import { Button } from '../src/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../src/card'
import { Input } from '../src/input'
import { Code } from '../src/code'
import './styles.css'

export default function App() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>UI Components Playground</h1>

      {/* Button Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Button Component</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* Input Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Input Component</h2>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', maxWidth: '300px' }}>
          <Input placeholder="Enter text..." />
          <Input type="email" placeholder="Enter email..." />
          <Input disabled placeholder="Disabled input..." />
        </div>
      </section>

      {/* Card Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Card Component</h2>
        <div style={{ maxWidth: '350px' }}>
          <Card>
            <CardHeader>
              <CardTitle>Create project</CardTitle>
              <CardDescription>Deploy your new project in one-click.</CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label htmlFor="name">Name</label>
                    <Input id="name" placeholder="Name of your project" />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline">Cancel</Button>
              <Button>Deploy</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Code Section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Code Component</h2>
        <div style={{ maxWidth: '400px' }}>
          <Code>const message = 'Hello, World!';</Code>
        </div>
      </section>
    </div>
  )
}
