import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/todo-api";
import { todoCookieName, validTodoSession } from "@/lib/todo-auth";

async function authorized() {
  const store = await cookies();
  return validTodoSession(store.get(todoCookieName)?.value);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(await updateTask(id, await request.json()));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not update task.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorized()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    return NextResponse.json(await deleteTask(id));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not delete task.",
      },
      { status: 502 },
    );
  }
}
