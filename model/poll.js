const { query } = require('../db')

const notFoundError = require('../errors/404')

module.exports = {
    getPollById: pollId => new Promise(async (resolve, reject) => {

        const polls = await query(`SELECT * from poll WHERE id = ?`, [pollId])
        if (polls.length === 0) return reject(notFoundError())

        const poll = polls[0]
        const options = await this.getOptionsForPoll(pollId)
        const votes = await this.getVotesForPoll(pollId)

        const fullPoll = {
            ...poll,
            options: options,
            votes: votes
        }

        resolve(fullPoll)
    }),

    getVotesForPoll: pollId => query(`SELECT * FROM vote WHERE pollId = ?`, [pollId]),

    getOptionsForPoll: pollId => query(`SELECT * FROM pollOption WHERE pollId = ?`, [pollId])
}