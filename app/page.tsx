"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) fetchBookmarks(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) fetchBookmarks(session.user.id);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function fetchBookmarks(userId: string) {
    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  }

  async function addBookmark() {
    if (!title || !url) return;

    await supabase.from("bookmarks").insert([
      {
        title,
        url,
        user_id: session.user.id,
      },
    ]);

    setTitle("");
    setUrl("");
    fetchBookmarks(session.user.id);
  }

  async function deleteBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks(session.user.id);
  }

  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (!session) {
    return (
      <div style={{ padding: 40 }}>
        <h1>Bookmark Manager</h1>
        <button onClick={signIn}>Sign in with Google</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Welcome {session.user.email}</h1>
      <button onClick={signOut}>Logout</button>

      <hr />

      <h2>Add Bookmark</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={addBookmark}>Add</button>

      <hr />

      <h2>Your Bookmarks</h2>
      {bookmarks.map((bookmark) => (
        <div key={bookmark.id}>
          <a href={bookmark.url} target="_blank">
            {bookmark.title}
          </a>
          <button onClick={() => deleteBookmark(bookmark.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
