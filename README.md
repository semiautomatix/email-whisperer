# Email Whisperer

## Overview

Email Whisperer is an AI-powered assistant for Gmail that helps users manage their email more efficiently. The application integrates with Gmail via Google OAuth to provide intelligent email organization, summary generation, and response suggestions.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Supabase for database and authentication
- **State Management**: React Context, React Query
- **Authentication**: Supabase Auth with Google Provider
- **API Integration**: Gmail API via Google OAuth
- **AI Integration**: OpenAI and other providers for email analysis

## Features

- Gmail integration with secure OAuth authentication
- AI-powered email summarization
- Smart response suggestions
- Email organization and categorization
- User-friendly, modern interface

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm 8.15+
- A Supabase account
- Google Developer account with Gmail API access
- OpenAI API key (or other supported AI providers)

### Setup

1. **Clone the repository**

```sh
git clone https://github.com/semiautomatix/email-whisperer.git
cd email-whisperer
```

2. **Install dependencies**

```sh
pnpm install
```

3. **Set up Supabase**

- Create a new project in [Supabase](https://supabase.com)
- Set up authentication with Google OAuth provider:
  1. Go to Authentication > Providers > Google
  2. Enable the Google provider
  3. Create a Google OAuth application in the [Google Cloud Console](https://console.cloud.google.com/)
  4. Add authorized origins and redirect URIs for local development and production
  5. Copy the Client ID and Client Secret to your Supabase configuration
- Set up required database tables (see [Database Setup](#database-setup) below)

4. **Environment Variables**

Copy the `.env.example` file to `.env.local` and fill in your values:

```sh
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

- Add Supabase URL and keys
- Add Google OAuth credentials
- Add NextAuth configuration
- Add OpenAI API key (or other AI provider keys)

5. **Run the development server**

```sh
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Setup

The application uses Supabase for data storage and authentication. To set up the database:

1. Install the Supabase CLI if you haven't already
2. Start the local Supabase development environment:

```sh
pnpm supabase:start
```

3. Follow the instructions in [supabase/README.md](./supabase/README.md) to:
   - Log in to Supabase
   - Link your project
   - Push the migrations to set up the database schema

The migrations will create all necessary tables and set up row-level security policies automatically.

## Authentication

This application uses Supabase Auth directly with Google as the only provider. We've chosen this approach for:

- **Simplicity**: Direct integration with Supabase
- **OAuth Management**: Proper handling of tokens and refreshes
- **Security**: Sensitive credentials managed by Supabase

See [docs/AUTH.md](./docs/AUTH.md) for detailed information about the authentication implementation.

## Development Workflow

### Build

```sh
pnpm build
```

### Run Tests

```sh
pnpm test
```

### Linting

```sh
pnpm lint
```

### Type Checking

```sh
pnpm check-types
```

## Project Structure

```
email-whisperer/
├── apps/                  # Application code
│   └── web/               # Next.js web application
├── packages/              # Shared packages
│   ├── eslint-config/     # ESLint configuration
│   ├── langgraph-api/     # LangGraph API integration
│   └── typescript-config/ # TypeScript configuration
├── docs/                  # Project documentation
├── public/                # Static assets
└── supabase/              # Supabase configuration and migrations
```

## Deployment

The application can be deployed to any platform that supports Next.js applications, such as Vercel, Netlify, or a custom server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Author

For more information about the creator of this project, visit [https://gaul.dev](https://gaul.dev).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
