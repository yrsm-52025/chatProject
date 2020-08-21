/**
 * 获取好友列表
 * 请求方式: get
 * 请求数据: data
 *  [sign_str]: 签名字符串
 *  [user_id]:  当前用户ID
 */
function getFriendList(flag, fn = function () { }) {
    $.ajax({
        url: `${APIPATH}interface/getFriends.php`,
        type: 'get',
        data: {
            sign_str: mainPageData.sign_str,
            user_id: mainPageData.id
        },
        success: function (res) {
            mainPageData.friendList = res.data;
            var target = flag ? $('.message-friend-list ul') : $('.has-friend-list ul');
            target.html('');
            if (mainPageData.friendList.length == 0) {
                target.html('<div style="color: #ffffff; margin-top: 20px; text-align: center; font-size: 16px;">暂无好友</div>');
            } else {
                for (var i = 0; i < mainPageData.friendList.length; i++) {
                    renderFriendList(mainPageData.friendList[i], target, flag);
                }
            }
            // 执行回调函数
            fn();
        },
        error: function (err) {
            console.log(err)
        }
    })
}

/**
 * 发送消息
 * @param {*} message
 * @param {*} receive_user_id
 * @param {*} type
 */
function sendMessage(message, receive_user_id, type, date) {
    var data = {
        sign_str: mainPageData.sign_str,
        user_id: mainPageData.id,
        receive_user_id: receive_user_id,
        message: message
    }
    $.ajax({
        url: `${APIPATH}interface/sendMessage.php`,
        type: 'post',
        data: data,
        dataType: 'json',
        success: function (res) {
            console.log(res)
            if (res.code == 0) {
                /* 发送成功, 更新签名时间 */
                mainPageData.sign_str = res.data.data.sign_str;
                renderMessage(message, mainPageData.headLogo, type,date);
            } else if (res.code == '101') {
                /* 发送失败, 还不是好友 */
                promptMessage('你还不是对方好友, 不能发送消息.', 'warning', 0, '', 'info-sign', [{
                    text: '添加对方为好友.',
                    action: function () {
                        deleteFriend();
                        addFriend();
                    }
                }]
                ).show();
            } else {
                /* 发送失败, 签名过期等 */
                promptMessage('发送失败, 本次登录可能已经过期.', 'warning', 3000, 'info-sign');
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

/**
 * 接收消息(长轮询监听)
 */
function receiveMessage() {
    var flag = true;
    var data = {
        sign_str: mainPageData.sign_str,
        user_id: mainPageData.id,
    };
    $.ajax({
        url: `${APIPATH}interface/getMessages.php`,
        type: 'get',
        timeout: 60 * 1000,
        data: data,
        dataType: 'json',
        success: function (res) {
            if (res.code == 0) {
                /* 收到消息成功 */
                for (var item of res.data) {
                    if (item.user_id == sessionFriendId) {
                        var time = new Date((+item.message_send_time)*1000).toTimeString().split(' ')[0];
                        renderMessage(item.message, item.head_logo, 'receive', time, item);
                    } else {
                        handleSessionMessage(res.data);
                    }
                }
            } else {
                /* 发送失败, 签名过期等 */
                flag = false;
                promptMessage('发送失败, 本次登录可能已经过期.', 'warning', 3000, 'info-sign');
            }
        },
        error: function (err1, err2, err3) {
            // console.log(err1, err2, err3);
        },
        complete: function () {
            flag && receiveMessage();
        }
    })
}

/**
 * 获取好友信息
 * @param {*} friend_id
 */
function getUserInfo(friendId, isFriend, fn) {
    $.ajax({
        url: `${APIPATH}interface/getUserInfo.php`,
        type: 'get',
        data: {
            sign_str: mainPageData.sign_str, user_id: mainPageData.id, friend_id: friendId
        },
        success: function (res) {
            if (res.code == 3) {
                promptMessage('本次登录已经过期, 请重新登录.', 'warning', 3000, 'info-sign',
                    [{
                        text: '返回登录页面',
                        action: function () {
                            location.href = '../index.html';
                        }
                    }]
                ).show();

            } else if (res.code == 0) {
                // 执行回调函数
                fn ? fn(res.data[0]) : renderFriendInfo(res.data[0], isFriend);
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

/**
 * 发送消息
 */
function sendFriendMessage() {
    getUserInfo(mainPageData.operationFriendId, true, function (userinfo) {
        sessionFriendId = userinfo.id;
        sessionFriendHeadLogo = userinfo.head_logo;
        sessionFriendUsername = userinfo.username;
        sessionFriendNickname = userinfo.nickname;
        getFriendList(true, function () {
            $(`.message-friend-list ul li[data-user_id='${sessionFriendId}']`).addClass('current-friend');
            renderMessageFriendInfo(userinfo);
            getHistoryMessage();
        });
        $(".message-menu").addClass('sub-current').siblings().removeClass('sub-current');
        $('.main').children().eq(0).addClass('main-current').siblings().removeClass('main-current');
    });
}


/**
 * 发送添加好友申请
 */
function addFriend() {
    $.ajax({
        url: `${APIPATH}interface/addFriend.php`,
        type: 'post',
        data: { sign_str: mainPageData.sign_str, user_id: mainPageData.id, friend_user_id: mainPageData.operationFriendId },
        dataType: 'json',
        success: function (res) {
            if (res.code == 0) {
                /* 发送申请成功 */
                mainPageData.sign_str = res.data.sign_str;
                promptMessage(`${res.msg}.`, 'success', 3000, 'check-circle-o').show();
            } else if (res.code == '100') {
                /* 发送申请失败 */
                promptMessage(`${res.msg}.`, 'warning', 3000, 'info-sign').show();
            } else {
                /* 发送申请失败 */
                promptMessage('发送添加申请失败.', 'error', 3000, 'info-sign').show();
            }
        }
    })
}

/**
 * 删除好友
 */
function deleteFriend() {
    $.ajax({
        url: `${APIPATH}interface/removeFriend.php`,
        type: 'post',
        data: { sign_str: mainPageData.sign_str, user_id: mainPageData.id, friend_id: mainPageData.operationFriendId },
        dataType: 'json',
        success: function (res) {
            if (res.code == 0) {
                /* 删除成功 */
                promptMessage('删除成功.', 'success', 3000, 'check-circle-o').show();
                getFriendList(false);
                $(".friend-info").html('');
                mainPageData.operationFriendId = null;
            } else {
                /* 删除失败 */
                console.log(res, mainPageData.operationFriendId)
                promptMessage('删除失败, 本次登录可能已经过期.', 'warning', 3000, 'info-sign').show();
            }
        }
    })
}

/**
 * 获取历史消息记录并渲染到页面
 */
function getHistoryMessage() {
    $.ajax({
        url: `${APIPATH}interface/getChatHistory.php`,
        type: 'get',
        data: { sign_str: mainPageData.sign_str, user_id: mainPageData.id, friend_id: sessionFriendId },
        success: function (res) {
            $('.session-content ul').html('');
            for (var item of res.data) {
                var time = new Date((+item.message_send_time)*1000).toTimeString().split(' ')[0];
                renderMessage(item.message, item.user_id == mainPageData.id ? mainPageData.headLogo : sessionFriendHeadLogo, item.user_id == mainPageData.id ? 'send' : 'receive', time, item);
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

/**
 * 获取好友申请(长轮询)
 *
 */
function getFriendRequests() {
    var data = { sign_str: mainPageData.sign_str, user_id: mainPageData.id }
    var flag = true;
    $.ajax({
        url: `${APIPATH}interface/getFriendRequests.php`,
        type: 'get',
        data: data,
        timeout: 20 * 1000,
        dataType: 'json',
        success: function (res) {
            if (res.code == 0) {
                for (var i = 0; i < res.data.length; i++) {
                    if (!Object.keys(mainPageData.friendRequests).includes(res.data[i].request_id)) {
                        mainPageData.friendRequests[res.data[i].request_id] = res.data[i];
                        mainPageData.friendRequests[res.data[i].request_id].handleResult = 0;
                        $("#friend-request-count").html(parseInt($("#friend-request-count").html()) + 1);
                    }
                }
            } else if (res.code == 3) {
                flag = false;
            }
        },
        error: function (err1, err2, err3) {
            if (err3 != 'timeout') {
                console.log(err1, err2)
            }
        },
        complete: function () {
            flag && getFriendRequests();
        }
    })
}

/**
 * 处理好友申请
 *
 * @param {*} from_user_id
 * @param {*} request_id
 * @param {*} process_result
 */
function processFriendRequest(from_user_id, request_id, process_result) {
    var data = {
        sign_str: mainPageData.sign_str,
        user_id: mainPageData.id,
        from_user_id: from_user_id,
        request_id: request_id,
        process_result: process_result
    }
    $.ajax({
        url: `${APIPATH}interface/processFriendRequest.php`,
        type: 'post',
        data: data,
        dataType: 'json',
        success: function (res) {
            if (res.code == 0) {
                promptMessage('处理成功.', 'success', 3000, 'check-circle-o').show();
                $("#friend-request-count").html(parseInt($("#friend-request-count").html()) - 1);
                delete mainPageData.friendRequests[request_id];
                $(`.handle-apply li .btn-group[data-request_id=${request_id}]`).html(`<button type="button" class="btn btn-block disabled">已${process_result == 1 ? '同意' : '拒绝'}</button>`)
                getFriendList(false);
            } else {
                if (res.code == 3) {
                    // 签名字符串过期
                    signatureExpired.show();
                } else {
                    promptMessage('处理失败.', 'error', 3000, 'info-sign').show();
                }
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}


/**
 *退出登录
 *
 */
function exitLogin() {
    $.ajax({
        url: `${APIPATH}interface/logout.php`,
        type: 'post',
        data: { sign_str: mainPageData.sign_str, user_id: mainPageData.id },
        success: function (res) {
            if (res.code == 0) {
                promptMessage('退出成功! 5秒后返回登录页面.', 'success', 5000, 'check-circle-o', false, [{
                    text: '返回登录页面',
                    action: function () { location.href = '../index.html'; }
                }]
                ).show();
                setTimeout(() => {
                    location.href = '../index.html';
                }, 5000);
            } else if (res.code == 3) {
                // 签名字符串过期
                signatureExpired.show();
            } else {
                promptMessage('退出失败! 请重试.', 'warning', 3000, 'times').show();
            }
        },
        error: function (err) {
            console.log(err)
        }
    })
}

/**
 * 获取搜索用户
 *
 * @param {*} val
 */
function getSearchUsers(val) {
    $.ajax({
        type: "get",
        url: `${APIPATH}interface/getSearchUsers.php`,
        data: { sign_str: mainPageData.sign_str, user_id: mainPageData.id, search_text: val },
        dataType: "json",
        success: function (res) {
            if (res.code == 3) {
                // 签名字符串过期
                signatureExpired.show();
            } else if (res.code == 0) {
                mainPageData.findFriend = res.data;
                renderFindFriend(mainPageData.findFriend);
            }
        },
        error: function (e) {
            console.log(e)
        }
    })
}
