import fileInclude from "gulp-file-include";

import webpHtmlNosvg from "gulp-webp-html-nosvg";

// не позволает браузеру кешировать файлы, привязывает к ним ключ: дату и время добавления в таком формате
// например  js/app.min.js?_v=20211219172008 где 20211219172008 это 2021.12.19 17:20:08,
// и собирает эти ключи в файле version.json
import versionNumber from "gulp-version-number";



// import pug from "gulp-pug"; сжатие html файлов

export const html = () => {
	return app.gulp.src(app.path.src.html)
		.pipe(app.plugins.plumber(
			app.plugins.notify.onError({
				title: "HTML",
				message: "Error: <%= error.message %>"
			}))
		)
		.pipe(fileInclude())
		/*
		.pipe(pug({
			// Cжатие HTML файла
			pretty: true,
			// Показывать в терминале какой файл обработан
			verbose: true
		}))
		*/
		.pipe(app.plugins.replace(/@img\//g, 'img/'))
		// .pipe(
		// 	app.plugins.if(
		// 		app.isBuild,
		// 		webpHtmlNosvg()
		// 	)
		// )
		.pipe(
			app.plugins.if(
				app.isBuild,
				versionNumber({
					'value': '%DT%',
					'append': {
						'key': '_v',
						'cover': 0,
						'to': [
							'css',
							'js',
						]
					},
					'output': {
						'file': 'gulp/version.json'
					}
				})
			)
		)
		.pipe(app.gulp.dest(app.path.build.html))
		.pipe(app.plugins.browsersync.stream());
         
}