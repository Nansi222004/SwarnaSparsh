import React, { useEffect, useMemo, useState } from "react";
import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../../services/api";
import Loader from "../../shared/components/Loader";
import { getBlogFallback, handleImageError } from "../../../utils/imageFallbacks";

const stripHtml = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const BlogsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await api.get("public/blogs");
        setBlogs(res.data.data.blogs || []);
      } catch (err) {
        console.error("Fetch blogs failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
    document.title = "Blogs | Swarna Sparsh";
  }, []);

  const filteredBlogs = useMemo(
    () =>
      blogs.filter(
        (blog) =>
          blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          blog.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stripHtml(blog.content)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [blogs, searchTerm],
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans pb-20 selection:bg-[#C59B27] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14">
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#C59B27]">
            Journal
          </p>
          <h1 className="mt-4 text-4xl md:text-6xl font-display text-black">
            Stories, Care, and Craft
          </h1>
          <p className="mt-4 text-base md:text-lg text-gray-600 font-serif">
            Explore styling tips, jewelry care, collection launches, and the
            stories behind our designs.
          </p>
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full max-w-xl mx-auto px-5 py-3 rounded-full border border-[#E8DFD0] bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C59B27]/20"
            />
          </div>
        </div>

        {filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog._id}
                className="bg-white rounded-[2rem] border border-[#E8DFD0] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
              >
                <Link
                  to={`/blogs/${blog.slug}`}
                  className="block aspect-[4/3] bg-gray-100 overflow-hidden"
                >
                  <img
                    src={blog.coverImage || getBlogFallback(blog.category || blog.title)}
                    alt={blog.title}
                    onError={(e) => handleImageError(e, getBlogFallback(blog.category || blog.title))}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                  />
                </Link>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3E2723]/45 mb-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(
                        blog.publishedAt || blog.createdAt,
                      ).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{blog.category}</span>
                  </div>
                  <h2 className="text-2xl font-display text-black leading-tight mb-3">
                    {blog.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">
                    {blog.excerpt ||
                      `${stripHtml(blog.content).slice(0, 160)}...`}
                  </p>
                  <Link
                    to={`/blogs/${blog.slug}`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-[#141211] hover:text-[#C59B27] transition-colors"
                  >
                    Read Article
                    <ArrowRight className="w-4 h-4 text-[#C59B27]" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900">
              No articles found
            </h3>
            <p className="text-gray-500">Try a different search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;
