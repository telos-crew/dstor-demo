const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data')

require('dotenv').config()

const fileDir = './public'
const filePaths = []

const {
	DSTOR_DOMAIN,
	DSTOR_ACCESS_TOKEN_ENDPOINT,
	DSTOR_EMAIL,
	DSTOR_PASSWORD,
	DSTOR_UPLOAD_TOKEN_ENDPOINT,
	DSTOR_UPLOAD_ENDPOINT
} = process.env

const getAccessTokenWithCredentials = async () => {
	try {
		if (!DSTOR_ACCESS_TOKEN_ENDPOINT) throw new Error('token endpoint not found in env file')

		console.log(DSTOR_ACCESS_TOKEN_ENDPOINT, DSTOR_EMAIL, DSTOR_PASSWORD)
		const {
			data: { access_token },
		} = await axios(`${DSTOR_DOMAIN}/${DSTOR_ACCESS_TOKEN_ENDPOINT}`, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
			data: {
				email: DSTOR_EMAIL,
				password: DSTOR_PASSWORD,
			},
		})

		if (!access_token) throw new Error('Error getting token')

		console.log('access_token from credentials: ', access_token)
		return access_token
	} catch (error) {
		console.log('login error: ', error)
		return undefined
	}
}

const getUploadTokenWithAccessToken = async (accessToken) => {
	try {
		if (!accessToken) throw new Error('Error getting access token')
		const uploadTokenUrl = `${DSTOR_DOMAIN}/${DSTOR_UPLOAD_TOKEN_ENDPOINT}`
		console.log('uploadTokenUrl: ', uploadTokenUrl)
		const { data } = await axios(uploadTokenUrl, {
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			data: {
				chunks_number: 1,
				// folder_to_upload_to: 0,
				folder_path: '/',
			},
		})

		console.log('getUploadTokenWithAccessToken data: ', data)
		if (!data.token) throw new Error('Error getting upload token')

		console.log('data.token: ', data.token)
		return data.token
	} catch (err) {
		console.log('getUploadToken error: ', err)
	}
}

const uploadFile = async (
	uploadToken,
	accessToken,
	file,
	comment
) => {
	try {
		console.log('uploading file: ')
		if (!DSTOR_UPLOAD_ENDPOINT) throw new Error('add file endpoint not found.')

		const fd = new FormData()
		fd.append('', file)
		// console.log('uploadFile token: ', token)
		// console.log('DSTOR_UPLOAD_ENDPOINT', DSTOR_UPLOAD_ENDPOINT)
		console.log('headers: ', fd.getHeaders())
		const { data } = await axios(`${DSTOR_DOMAIN}/${DSTOR_UPLOAD_ENDPOINT}`, {
			method: 'post',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Access-Control-Allow-Origin': '*',
				'Content-Type': 'multipart/form-data',
				'x-dstor-upload-token': uploadToken,
				// 'x-dstor-parent-id': 0, // root folder,
				'x-dstor-comment': 'From DecideVoter',
				...fd.getHeaders(),
			},
			data: fd,
		})

		console.log('upload data: ', data)
		let hash
		if (data && data.upload_token && !data.errorAtStage) {
			while (!hash) {
				const { data: uploadStatus } = await axios(`${DSTOR_DOMAIN}/${DSTOR_UPLOAD_STATUS_ENDPOINT}`, {
					headers: {
						'Authorization': `Bearer ${accessToken}`,
						'Access-Control-Allow-Origin': '*',
						'Content-Type': 'application/json',
						'x-dstor-upload-token': uploadToken,
					},
				})
				console.log('uploadFile uploadStatus: ', uploadStatus)
				if (uploadStatus.status === 'DONE') {
					hash = uploadStatus.data[0].Hash
				}
			}
		}
		return {
			hash
		}
	} catch (err) {
		console.log('uploadFile error: ', err.message)
		return undefined
	}
}

const main = async () => {
	const accessToken = await getAccessTokenWithCredentials()
	console.log('accessToken: ', accessToken)
	const uploadToken = await getUploadTokenWithAccessToken(accessToken)
	console.log('uploadToken: ', uploadToken)
	for (const file of filePaths) {
		const fileData = fs.createReadStream(file)
		console.log('fileData: ', fileData)
		await uploadFile(uploadToken, accessToken, fileData)
	}
}

fs.readdirSync(fileDir).forEach(filePath => {
  console.log(filePath);
	filePaths.push(`${fileDir}/${filePath}`)
})

main()