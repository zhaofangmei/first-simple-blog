const DB = require('./db.js');
const conn = DB.getConnection();
const Post = require('../models/post.js')

function Comment(name, time, title, comment) {
    this.user_name = name,
        this.create_time = time,
        this.title = title,
        this.comment = comment
}

module.exports = Comment

Comment.prototype.save = function (callback) {
    let query = {
        name: this.user_name,
        time: this.create_time,
        title: this.title
    }

    Post.getOne(query, (err, posts) => {
        if (err) {
            return callback(err);
        }

        if (posts && posts.length > 0) {
            let post = posts[0];

            if (this.comment) {
                post.comments.push(this.comment);
            }
            let params = {
                comments: JSON.stringify(post.comments)
            }
            let sqlString = 'update t_blog_post set ? where id = ? ';
            let update = conn.query(sqlString, [params, post.id], function (error, results, fields) {
                if (error) {
                    console.log('error: ', error)
                    return callback(error);
                }
                return callback(null, 'success')
            });

            console.log(update.sql);

        } else {
            return callback('无此用户！')
        }
    });

}