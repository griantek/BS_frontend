"use client";

import React, { useEffect, useState } from 'react';

export default function JournalsLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div>
      <main 
        className="transition-all duration-300"
      >
        {children}
      </main>
    </div>
  );
}
