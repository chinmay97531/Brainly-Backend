# Brainly Backend

Brainly Backend is a server-side application built with Node.js, Express, and MongoDB. It provides a robust API for managing users, authentication, and other backend functionalities.

## Features
- User authentication with JWT
- MongoDB database integration
- Secure API routes

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/brainly-backend.git
   ```
2. Navigate to the project directory:
   ```sh
   cd brainly-backend
   ```
3. Install dependencies:
   ```sh
   npm install
   npm install mongoose express jsonwebtoken zod bcrypt
   npm install --save-dev @types/express @types/jsonwebtoken @types/bcrypt
   ```
4. Set up environment variables in a `config.ts` file:
   ```env
   JWT_SECRET = your_jwt_secret
   MONGODBURL = your_mongodb_connection_string
   ```
5. Start the development server:
   ```sh
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/v1/signup` - Register a new user
- `POST /api/v1/login` - Authenticate and get a token

### Content
- `POST /api/v1/content` - Post Content
- `GET /api/v1/content` - Get Content details
- `DELETE /api/v1/content` - Delete Content
- `POST /api/v1/brain/share` - Share Content
- `GET /api/v1/brain/share/"Your Shared Hash"` - Share Content Details

## Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.


