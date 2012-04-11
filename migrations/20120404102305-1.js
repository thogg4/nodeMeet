module.exports = {
  up: function(migration, DataTypes) {
    migration.createTable(
      "users",
      {
        email: DataTypes.STRING,
        username: {
          type: DataTypes.STRING,
          allowNull: false
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        }
      }
    )
  },
  
  down: function(migration, DataTypes) {
    migration.dropTable("users")
  }
  
}