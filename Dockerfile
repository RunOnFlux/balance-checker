# Use an official Node.js runtime as a parent image with Node.js 18
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy the application code to the container
COPY . .

# Install the application dependencies
RUN npm install
RUN cd frontend && npm install

# Expose the port on which your application will run
EXPOSE 4444
EXPOSE 3000
ENV FLUXOS=true

# Define the default command to run when the container starts
CMD ["/bin/bash", "-c", "npm start & cd frontend && npm start"]