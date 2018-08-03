-- ----------------------------
-- Table structure for `t_blog_post`
-- ----------------------------
DROP TABLE IF EXISTS `t_blog_post`;
CREATE TABLE `t_blog_post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(128) NOT NULL,
  `title` varchar(128) NOT NULL,
  `head` varchar(256) DEFAULT NULL,
  `tag` varchar(256) DEFAULT NULL,
  `create_time` varchar(26) NOT NULL,
  `post` longtext,
  `pv` int(11) DEFAULT NULL,
  `comments` longtext,
  `reprint_info` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8;