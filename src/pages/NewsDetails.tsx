import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getNews, listComments, addComment } from '../api/newsService';

export default function NewsDetails() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const res = await getNews(id);
        setItem(res);
        const c = await listComments(id, { page: 1, limit: 20 });
        setComments(c.comments || []);
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [id]);

  const submit = async () => {
    if (!id) return;
    try {
      await addComment(id, { content: commentText });
      setCommentText('');
      const c = await listComments(id, { page: 1, limit: 20 });
      setComments(c.comments || []);
    } catch (err) {
      console.error(err);
      alert('Failed to add comment');
    }
  };

  if (!item) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <div className="text-sm text-gray-500">
          By {item.author?.fullname} · {new Date(item.createdAt).toLocaleString()}
        </div>
        <div
          className="mt-4"
          dangerouslySetInnerHTML={{ __html: item.content || '' }}
        />

        {item.attachments && item.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {item.attachments.map((a: any, i: number) => (
              <img
                key={i}
                src={a.url}
                alt={a.name || 'attachment'}
                className="w-full h-64 object-cover rounded"
              />
            ))}
          </div>
        )}

        <div className="mt-6">
          <h3 className="font-semibold">Comments</h3>
          <div className="mt-2">
            {comments.length === 0 && (
              <div className="text-gray-500">No comments yet</div>
            )}
            {comments.map((c: any) => (
              <div key={c._id} className="border-b py-2">
                <div className="text-sm font-medium">{c.user?.fullname}</div>
                <div className="text-sm">{c.content}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="w-full border p-2 rounded"
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={submit}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
