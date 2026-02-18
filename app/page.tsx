"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // ================= AUTH =================
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

  // ================= FETCH =================
  async function fetchBookmarks(userId: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("FETCH DATA:", data);
    console.log("FETCH ERROR:", error);

    if (!error) setBookmarks(data || []);
    setLoading(false);
  }

  // ================= ADD =================
  async function addBookmark() {
    if (!title || !url || !session) return;

    const { data, error } = await supabase.from("bookmarks").insert([
      {
        title,
        url,
        category,
        user_id: session.user.id,
      },
    ]);

    console.log("INSERT DATA:", data);
    console.log("INSERT ERROR:", error);

    if (!error) {
      setTitle("");
      setUrl("");
      setCategory("General");
      fetchBookmarks(session.user.id);
    }
  }

  // ================= UPDATE =================
  async function updateBookmark() {
    if (!title || !url || !editingId || !session) return;

    const { error } = await supabase
      .from("bookmarks")
      .update({ title, url, category })
      .eq("id", editingId);

    console.log("UPDATE ERROR:", error);

    if (!error) {
      setTitle("");
      setUrl("");
      setCategory("General");
      setEditingId(null);
      fetchBookmarks(session.user.id);
    }
  }

  // ================= DELETE =================
  async function deleteBookmark(id: string) {
    if (!session) return;

    const { error } = await supabase.from("bookmarks").delete().eq("id", id);
    console.log("DELETE ERROR:", error);

    fetchBookmarks(session.user.id);
  }

  // ================= AUTH =================
  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ================= LOGIN =================
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <button onClick={signIn} className="btn-primary">
          Sign in with Google
        </button>
      </div>
    );
  }

  // ================= UI =================
  return (
    <div className="min-h-screen p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Welcome {session.user.email}
        </h1>
        <button onClick={signOut} className="btn-secondary">
          Logout
        </button>
      </div>

      <div className="card mb-6">
        <h2 className="font-semibold mb-4">
          {editingId ? "Edit Bookmark" : "Add Bookmark"}
        </h2>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
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
          <input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <button
          onClick={editingId ? updateBookmark : addBookmark}
          className="btn-primary"
        >
          {editingId ? "Update" : "Add"}
        </button>
      </div>

      <input
        placeholder="Search bookmarks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />

      <div className="grid md:grid-cols-2 gap-4">
        {bookmarks
          .filter((b) =>
            b.title.toLowerCase().includes(search.toLowerCase())
          )
          .map((b) => (
            <div key={b.id} className="card">
              <h3 className="font-semibold">{b.title}</h3>
              <p className="text-sm">{b.category}</p>

              <a
                href={b.url}
                target="_blank"
                className="text-blue-600 underline"
              >
                Visit
              </a>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setTitle(b.title);
                    setUrl(b.url);
                    setCategory(b.category);
                    setEditingId(b.id);
                  }}
                  className="btn-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBookmark(b.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
