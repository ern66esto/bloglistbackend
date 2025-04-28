const mongoose = require('mongoose');

if (process.argv.length > 7) {
  console.log('give password as argument');
  process.exit(1);
}

const password = process.argv[2];
const title = process.argv[3];
const author = process.argv[4];
const urls = process.argv[5];
const likes = process.argv[6];

const url = `mongodb+srv://ernestoleobardo:${password}@cluster0.q4jvwce.mongodb.net/blogList?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.set('strictQuery', false);
mongoose.connect(url);

const blogSchema = new mongoose.Schema({
  title: String, 
  author: String,
  url: String,
  likes: Number
});

const Blog = mongoose.model('Blog', blogSchema);

if (title !== undefined && author !== undefined && urls !== undefined && likes !== undefined) {
  //CREATE
  const blog = new Blog({
    title: title, 
    author: author,
    url: urls,
    likes: likes
  });

  blog.save().then(result => {
    console.log(`added ${title} number ${author} to blogList`);
    mongoose.connection.close();
  });    
} else {
  // GET
  Blog.find({}).then(result => {
    console.log('blogList:');
    result.forEach(blog => {
      console.log(`${blog.title} ${blog.author} ${url} ${likes}`);
    });
    mongoose.connection.close();
  });
}; 
