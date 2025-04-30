const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes,0);
};

const favoriteBlog = (blogs) => {
  return blogs.reduce((max, blog) => blog.likes > max.likes ? blog : max , blogs[0]);
};

const mostBlogs = (blogs) => {
  const authorCounts = blogs.reduce((counts, blog) => {
    counts[blog.author] = (counts[blog.author] || 0) + 1;
    return counts;
  }, {});

  const mostBlogsAuthor = Object.keys(authorCounts).reduce((maxAuthor, author) => {
    return authorCounts[author] > authorCounts[maxAuthor] ? author : maxAuthor;
  }, Object.keys(authorCounts)[0]);

  return {author: mostBlogsAuthor, blogs: authorCounts[mostBlogsAuthor]};
};

const mostLikes = (blogs) => {
  const authorLikes = blogs.reduce((likes, blog) => {
    likes[blog.author] = (likes[blog.author] || 0) + blog.likes;
    return likes;
  }, {});

  const mostLikesAuthor = Object.keys(authorLikes).reduce((maxAuthor, author) => {
    return authorLikes[author] > authorLikes[maxAuthor] ? author : maxAuthor;
  }, Object.keys(authorLikes)[0]);

  return {author: mostLikesAuthor, likes: authorLikes[mostLikesAuthor]};
};



module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
};