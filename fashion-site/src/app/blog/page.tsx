import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - Fashion Store',
  description: 'Read the latest fashion tips, trends and style guides',
};

async function getPosts() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blog`, { 
      next: { revalidate: 60 } 
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Our Blog</h1>
        
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No blog posts available yet.</p>
            <Link href="/" className="text-[#ff3f6c] hover:underline mt-4 inline-block">
              Go back to home
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  {post.image && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#ff3f6c] mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{post.author || 'Fashion Store'}</span>
                      {post.publishedAt && (
                        <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {post.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}