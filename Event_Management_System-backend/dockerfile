FROM node:21-alpine

# Create a directory for the app
WORKDIR /app

# Copy package.json and package-lock.json to the app directory
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the rest of the app to the app directory(Bundling the app files to the container)
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the app
CMD ["npm", "start"]
