import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createTask, getTasks } from "@/lib/todo-api";
import { todoCookieName, validTodoSession } from "@/lib/todo-auth";

async function authorized() {
  const store = await cookies();
  return validTodoSession(store.get(todoCookieName)?.value);
}

export async function GET() {
  if (!(await authorized()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await getTasks());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not load tasks.",
      },
      { status: 502 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await createTask(await request.json()), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not save task.",
      },
      { status: 502 },
    );
  }
}
