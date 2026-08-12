import { useEffect, useState } from 'react';
import NewsComposer from '../components/common/NewsComposer';
import NewsCard from '../components/common/NewsCard';
import { listNews } from '../api/newsService';

export default function NewsFeed() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res = await listNews({ page: p, limit: 10 });
      if (p === 1) setItems(res.docs || []);
      else setItems(prev => [...prev, ...(res.docs || [])]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const onCreated = (n: any) => {
    setItems(prev => [n, ...prev]);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8">
          <NewsComposer onCreated={onCreated} />

          <div className="mt-4">
            {items.map((item: any) => (
              <NewsCard
                key={item._id}
                item={item}
                onUpdate={() => load(1)}
                onOpen={() => {
                  window.location.href = `/news/${item._id}`;
                }}
              />
            ))}

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setPage(p => p + 1);
                  load(page + 1);
                }}
                className="px-4 py-2 rounded bg-gray-100"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-20">
            <div className="bg-white rounded-lg shadow p-4 mb-4">Pinned</div>
            <div className="bg-white rounded-lg shadow p-4">Filters</div>
          </div>
        </div>
      </div>
    </div>
  );
}
