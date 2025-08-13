import React from "react";
import { LoginForm } from "../components/LoginForm";

function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-indigo-100 to-purple-200 dark:bg-gradient-to-br dark:from-purple-900/20 dark:via-indigo-800/30 dark:to-purple-900/20 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        <LoginForm />
      </div>
    </div>
  );
}

export default Login;
