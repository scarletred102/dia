# Web3 Digital Identity

A secure, self-sovereign identity management system built with blockchain technology.

## Features

- Self-sovereign identity management
- Blockchain-based verification
- Reputation scoring system
- Secure wallet integration
- DID (Decentralized Identifier) support

## Security Features

- Content Security Policy (CSP) implementation
- Security headers configuration
- Input validation and sanitization
- Rate limiting
- Error boundary implementation
- Secure wallet connection handling

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MetaMask or compatible Web3 wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web3-digital-identity.git
cd web3-digital-identity
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

### Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run security-check` - Run security checks

## Testing

The project uses Vitest for testing. Run tests with:

```bash
npm run test
```

For coverage report:
```bash
npm run test:coverage
```

## Security

This project implements several security measures:

- Content Security Policy (CSP)
- Security headers
- Input validation
- Rate limiting
- Error boundaries
- Secure wallet connections
- Regular security audits

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Ethers.js](https://docs.ethers.org/)
- [DID-JWT](https://github.com/decentralized-identity/did-jwt)
- [DID-Resolver](https://github.com/decentralized-identity/did-resolver) 