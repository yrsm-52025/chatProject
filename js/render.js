/**
 * 渲染好友列表
 * @param {*} data
 */
function renderFriendList(data, target, flag) {
    var str = '';
    if (flag) {
        str = `
            <li data-user_id=${data.user_id}>
                <div class="friend-avatar"><img src="${IMGPATH}${data.head_logo.replace('/chat_api', '')}" alt=""></div>
                <div class="friend-nickname">${data.nickname}</div>
                <span class="label label-dot label-${data.online == 1 ? 'success' : ''}"></span>
                <span class="label label-danger label-badge new-message" style="margin-left: 20px; display: none;">0</span>
            </li>
        `;
    } else {
        str = `
            <li data-user_id=${data.user_id} data-is_friend='true'>
                <div class="friend-avatar"><img src="${IMGPATH}${data.head_logo.replace('/chat_api', '')}" alt="" src=""></div>
                <div class="friend-item">
                    <div class="friend-username">用户ID: ${data.user_id}</div>
                    <div class="friend-nickname">昵称: ${data.nickname}</div>
                </div>
            </li>
        `;
    }
    target.append(str);
}


/**
 * 渲染好友信息
 * @param {*} data
 */
function renderMessageFriendInfo(data) {
    sessionFriendId = data.id;
    sessionFriendHeadLogo = data.head_logo;
    sessionFriendUsername = data.username;
    sessionFriendNickname = data.nickname;
    var str = '';
    str = `
        <div class="head-avatar">
            <img src="${IMGPATH}${data.head_logo.replace('/chat_api', '')}" alt="">
        </div>
        <div class="session-friend-info">
            <div class="friend-info-nickname">昵称: ${data.nickname}</div>
            <div class="friend-info-id">用户名: ${data.username}</div>
        </div>
    `;
    $(".session-friend .head").html(str);
}


/**
 * 渲染消息到页面上
 *
 * @param {*} message
 * @param {*} headLogo
 * @param {*} type
 */
function renderMessage(message, headLogo, type, message_send_time, item) {
    var str = `
        <li class="session-${type}">
            <div class="sender">
                <img src="${IMGPATH}${headLogo.replace('/chat_api', '')}" alt="">
            </div>
            <div class="message">
                ${message}
            </div>
            <div class="send-time" style="line-height: 40px;">
                ${message_send_time}
            </div>
        </li>
    `;
    $('.main-wrap .session-friend')
        .eq(0).removeClass('session-display-default').end()
        .eq(1).addClass('session-display-default');
    $('.session-content ul').append(str);
    $('.session-content').scrollTop($('.session-content')[0].scrollHeight);
}

/**
 * 处理会话的消息
 *
 * @param {*} data
 */
function handleSessionMessage(data) {
    for(var item of data) {
        if (Object.keys(mainPageData.newMessageList).includes(item.user_id)) {
            mainPageData.newMessageList.user_id.push(item);
        } else {
            mainPageData.newMessageList.user_id = [item];
        }
        var newMessage = $(`.message-friend-list ul li[data-user_id='${item.user_id}'] .new-message`);
        newMessage.css('display', 'block').html(+ newMessage.html() + 1)
    }
}

/**
 * 渲染搜索到的用户列表
 *
 * @param {*} data
 */
function renderFindFriend(data) {
    var str = '';
    if (data.length == 0) {
        str = '<li>暂无搜索结果</li>'
    } else {
        for (var i = 0; i < data.length; i++) {
            str += `
                <li data-user_id=${data[i].id}>
                    <div class="friend-avatar"><img src="${IMGPATH}${data[i].head_logo.replace('/chat_api', '')}" alt="" src=""></div>
                    <div class="friend-item">
                        <div class="friend-username">用户名: ${data[i].username}</div>
                        <div class="friend-nickname">昵称: ${data[i].nickname}</div>
                    </div>
                </li>
            `;
        }
    }
    $('.search-list ul').css('height', '360px').html(str);
}

/**
 * 渲染用户消息
 *
 * @param {*} data
 * @param {*} flag 
 * [true] 表示好友列表
 * [false] 表示搜索列表
 */
function renderFriendInfo(data, flag) {
    var str = `
        <div class="info-content">
            <div class="info-avatar" title="用户名: ${data.username}">
                <img src="${IMGPATH}${data.head_logo.replace('/chat_api', '')}" alt="">
            </div>
            <div class="info-username" title="用户名: ${data.username}">
                <span class="texta-justify">${flag ? '好友' : '用户'}名:</span>&ensp;
                <span>${data.username}</span>
            </div>
            <div class="info-nickname" title="昵称: ${data.nickname}">
                <span class="texta-justify">${flag ? '好友' : '用户'}昵称:</span>&ensp;
                <span>${data.nickname}</span>
            </div>
        </div>
        <div class="operation">
            <button class="btn ${flag ? 'btn-info btn-send-message' : 'disabled'}" type="button">发信息</button>
            <button class="btn btn-info ${flag ? 'btn-delete-friend' : 'btn-add-friend'}" type="button">${flag ? '删除' : '添加'}好友</button>
        </div>
    `;
    $(".friend-info").html(str);
    mainPageData.operationFriendId = data.id;
}