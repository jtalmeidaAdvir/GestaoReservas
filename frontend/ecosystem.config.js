module.exports = {
    apps: [
      {
        name: "react-app",
        script: "serve",
        args: "-s build -l 3000",
        env: {
          NODE_ENV: "production",
        },
      },
    ],
  };
  