/*****************************************************************************
#                                                                            #
#    KVMD - The main Pi-KVM daemon.                                          #
#                                                                            #
#    Copyright (C) 2018  Maxim Devaev <mdevaev@gmail.com>                    #
#                                                                            #
#    This program is free software: you can redistribute it and/or modify    #
#    it under the terms of the GNU General Public License as published by    #
#    the Free Software Foundation, either version 3 of the License, or       #
#    (at your option) any later version.                                     #
#                                                                            #
#    This program is distributed in the hope that it will be useful,         #
#    but WITHOUT ANY WARRANTY; without even the implied warranty of          #
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           #
#    GNU General Public License for more details.                            #
#                                                                            #
#    You should have received a copy of the GNU General Public License       #
#    along with this program.  If not, see <https://www.gnu.org/licenses/>.  #
#                                                                            #
*****************************************************************************/


var wm;

function main() {
	wm = new WindowManager();

	if (checkBrowser()) {
		__setAppText();
		__loadKvmdInfo();
	}
}

function __setAppText() {
	$("app-text").innerHTML = `
		<span class="code-comment"># On Linux using Chromium/Chrome via any terminal:<br>
		$</span> \`which chromium 2>/dev/null || which chrome 2>/dev/null\` --app="${window.location.href}"<br>
		<br>
		<span class="code-comment"># On MacOS using Terminal application:<br>
		$</span> /Applications/Google&bsol; Chrome.app/Contents/MacOS/Google&bsol; Chrome --app="${window.location.href}"<br>
		<br>
		<span class="code-comment"># On Windows via cmd.exe:<br>
		C:&bsol;&gt;</span> start chrome --app="${window.location.href}"
	`;
}

function __loadKvmdInfo() {
	var http = tools.makeRequest("GET", "/kvmd/info", function() {
		if (http.readyState === 4) {
			if (http.status === 200) {
				var info = JSON.parse(http.responseText).result;

				var apps = Object.values(info.extras).sort(function(a, b) {
					if (a["place"] < b["place"]) {
						return -1;
					} else if (a["place"] > b["place"]) {
						return 1;
					} else {
						return 0;
					}
				});

				$("apps-box").innerHTML = "<ul id=\"apps\"></ul>";

				$("apps").innerHTML += __makeApp(null, "kvm", "share/svg/kvm.svg", "KVM");

				apps.forEach(function(app) {
					$("apps").innerHTML += __makeApp(null, app.path, app.icon, app.name);
				});

				$("apps").innerHTML += __makeApp("logout-button", "#", "share/svg/logout.svg", "Logout");
				tools.setOnClick($("logout-button"), __logout);

				if (info.meta && info.meta.server && info.meta.server.host) {
					$("kvmd-meta-server-host").innerHTML = info.meta.server.host;
					document.title = "Pi-KVM Index: " + info.meta.server.host;
				} else {
					$("kvmd-meta-server-host").innerHTML = "";
					document.title = "Pi-KVM Index";
				}
			} else if (http.status === 401 || http.status === 403) {
				document.location.href = "/login";
			} else {
				setTimeout(__loadKvmdInfo, 1000);
			}
		}
	});
}

function __makeApp(id, path, icon, name) {
	return `<li>
		<div ${id ? "id=\"" + id + "\"" : ""} class="app">
			<a href="${path}">
				<div>
					<img class="svg-gray" src="${icon}">
					${name}
				</div>
			</a>
		</div>
	</li>`;
}

function __logout() {
	var http = tools.makeRequest("POST", "/kvmd/auth/logout", function() {
		if (http.readyState === 4) {
			if (http.status === 200 || http.status === 401 || http.status === 403) {
				document.location.href = "/login";
			} else {
				wm.error("Logout error:<br>", http.responseText);
			}
		}
	});
}
