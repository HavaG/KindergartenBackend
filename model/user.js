const { query, transaction, queryWithConnection } = require('../db')
const responses = require('../responses')
const bcrypt = require("bcrypt");

module.exports = {
    doesUserExists: userId => new Promise(async (resolve, reject) => {
        try {
            const users = await query(`SELECT *
                                       from user
                                       WHERE id = ?`, [userId])
            resolve(users.length > 0)
        } catch (error) {
            reject(error)
        }
    }),

    getUsersInGroup: (groupId) => query(`
            SELECT user.id, user.name, user.scope, user.username FROM user
            JOIN usersInGroup uIG on user.id = uIG.userId
            WHERE uIG.groupId = ?
        `, [groupId]),

    getUsersInGroupByRole: (groupId, role) => query(`
            SELECT user.id, user.name, user.scope, user.username FROM user
            JOIN usersInGroup uIG on user.id = uIG.userId
            WHERE uIG.groupId = ?
              AND scope = ?
        `, [groupId, role]),

    getUserById: (userId) => new Promise(async (resolve, reject) => {
        try {
            const users = await query(`SELECT *
                   FROM user
                   WHERE id = ?`, [userId])

            if (users.length === 0) return reject(responses.notFound())

            const children = await query(`SELECT * FROM child WHERE parentId = ?`, [users[0]['id']])

            resolve({
                ...users[0],
                children: children
            })
        } catch (error) {
            reject(error)
        }
    }),

    createUser: (user) => new Promise ((resolve, reject) => {
        try {

            console.log('halooc')

            bcrypt.hash(user.password, 10, (err, hash) => {
                if (err) return reject(err)

                console.log('alma')

                transaction(async connection => {
                    try {
                        await queryWithConnection(connection,
                                `INSERT INTO user (name, scope, username, password)
                                 VALUES (?, ?, ?, ?)`, [user.name, user.scope, user.username, hash])

                        const userId = (await queryWithConnection(connection,
                            `SELECT LAST_INSERT_ID() as id`))[0]['id']

                        console.log(`userId: ${userId}`)

                        connection.commit()
                        resolve(userId)
                    } catch (error) {
                        connection.rollback()
                        console.log(error)
                        reject(error)
                    }

                })
            });


        } catch (error) {
            reject (error)
        }
    }),

    deleteUser: userId => new Promise((resolve, reject) => {
        transaction(async connection => {
            try {

                await queryWithConnection(connection, `DELETE FROM usersInGroup
                                                       WHERE userId = ?`, [userId])

                await queryWithConnection(connection, `DELETE FROM userInThread
                                                       WHERE userId = ?`, [userId])

                await queryWithConnection(connection, `DELETE FROM user WHERE id = ?`, [userId])

                connection.commit()
                resolve()
            } catch (error) {
                connection.rollback()
                reject(error)
            }
        })
    }),

    getScopeOfUser: userId => new Promise(async (resolve, reject) => {
        try {

            const scope = (await query(`SELECT scope FROM user WHERE id = ?`,
                [userId]))[0]['scope']

            resolve(scope)

        } catch (error) {
            reject(error)
        }
    })

}