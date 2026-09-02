-- fixture for fill-inventory-db
CREATE TABLE IF NOT EXISTS sample_demo (
  id BIGINT PRIMARY KEY COMMENT '主键',
  name VARCHAR(64) COMMENT '名称',
  status CHAR(1) DEFAULT '1' COMMENT '状态:1启用0停用'
);
