# Contributing to SocialVibe

First off, thank you for considering contributing to SocialVibe! It's people like you that make SocialVibe such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node version, browser, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List some examples of how it would be used**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Commit your changes** with clear commit messages
6. **Push to your fork** and submit a pull request

#### Pull Request Guidelines

- Follow the existing code style
- Write clear, descriptive commit messages
- Include tests for new features
- Update documentation for API changes
- Keep pull requests focused on a single concern
- Reference related issues in your PR description

## Development Setup

### Prerequisites
- Node.js >= 18.0.0
- MongoDB >= 5.0
- Yarn package manager

### Setup Steps

1. Clone your fork:
```bash
git clone https://github.com/your-username/socialvibe.git
cd socialvibe
```

2. Install dependencies:
```bash
# Backend
cd backend
yarn install

# Frontend
cd ../frontend
yarn install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.example frontend/.env
```

4. Start development servers:
```bash
# Terminal 1 - Backend
cd backend
yarn start

# Terminal 2 - Frontend
cd frontend
yarn start
```

## Coding Standards

### JavaScript/React
- Use ES6+ features
- Use functional components with hooks
- Follow Airbnb JavaScript Style Guide
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Git Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests after first line

Examples:
```
Add user profile editing feature

Implements #123. Adds ability for users to edit their profile
information including avatar, bio, and display name.
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Test additions/changes

## Testing

### Running Tests
```bash
# Backend tests
cd backend
yarn test

# Frontend tests
cd frontend
yarn test
```

### Writing Tests
- Write tests for all new features
- Maintain existing test coverage
- Test edge cases and error conditions
- Use descriptive test names

## Documentation

- Update README.md for user-facing changes
- Update API documentation for endpoint changes
- Add JSDoc comments for new functions
- Update DESIGN_SYSTEM.md for UI changes

## Questions?

Feel free to open an issue with the tag "question" or reach out to the maintainers.

Thank you for contributing! 🎉
