# Use a base image with Node.js and npm (adjust version as needed)
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json if present
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the port your app runs on (adjust if needed)
EXPOSE 3000

# Start the application (adjust if your start command is different)
CMD ["npm", "start"]