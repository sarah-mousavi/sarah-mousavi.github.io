/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: {
      id: number;
      phone: string;
      name: string | null;
      education: string | null;
      occupation: string | null;
      role: string;
      sessionsCompleted: number;
      notes: string | null;
      createdAt: Date;
    } | null;
  }
}
