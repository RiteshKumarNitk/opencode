import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || post.title,
  };
}

async function getPost(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/blog/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/blog" 
          className="text-[#ff3f6c] hover:underline mb-4 inline-block"
        >
          ← Back to Blog
        </Link>
        
        {post.image && (
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full aspect-video object-cover rounded-xl mb-8"
          />
        )}
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-gray-500 mb-8 pb-8 border-b border-gray-200">
          <span>{post.author || 'Fashion Store'}</span>
          {post.publishedAt && (
            <>
              <span>•</span>
              <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
            </>
          )}
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex gap-2 mb-8">
            {post.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br/>') || '' }}
        />

        {post.isFeatured && (
          <div className="mt-12 p-6 bg-gray-50 rounded-xl">
            <p className="text-gray-600">
              This is a featured post. Check out more trending articles on our blog!
            </p>
            <Link href="/blog" className="text-[#ff3f6c] hover:underline mt-2 inline-block">
              View all posts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}