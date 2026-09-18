"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-4">
          My First App
        </h1>

        <p className="text-xl mb-6">
          Hello, Bay!
        </p>

        <button
          onClick={() => setCount(count + 1)}
          className="bg-black text-white px-6 py-3 rounded-xl"
        >
          +1
        </button>

        <p className="text-2xl mt-6">
          Count: {count}
        </p>
      </div>
    </main>
  );
}