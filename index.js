const axios = require('axios')

document.getElementById("filepicker").addEventListener("change", function(event) {
	let output = document.getElementById("listing");
	let files = event.target.files;

	for (let i=0; i<files.length; i++) {
		let item = document.createElement("li");
		item.innerHTML = files[i].webkitRelativePath;
		output.appendChild(item);

		const { data: { status } } = await axios({
      url: `${REACT_APP_API_BASE_URL}/v1/upload/`,
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'multipart/form-data',
        'x-dstor-upload-token': uploadToken,
      },
      method: 'post',
      data: fd,
      onUploadProgress: async progressEvent => {
        uploadCompleteSize = progressEvent.loaded
        dispatch({
          type: 'UPDATE_FILE_UPLOAD_PROGRESS',
          data: Math.floor(100 * ((alreadyUploadedSize + uploadCompleteSize) / totalSize))
        })
      }
    })
	};
}, false);