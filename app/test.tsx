'use client';

import { Button } from "@nextui-org/react";

export default function Test() {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Button color="primary">
          Test Button
        </Button>
      </div>
      <div className="bg-blue-500 text-white p-6 rounded-lg shadow-sm">
        Test Tailwind
      </div>
    </div>
  );
}
