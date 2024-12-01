import { Node, Project, SourceFile, ts } from 'ts-morph';
import { v4 } from 'uuid';

/**
 * Функция фабрики, которая создает функцию для клонирования узла в виде файла.
 * Если проект не передан, будет создан новый проект.
 *
 * @param {Project} [project] - Проект, в котором будет сохранен клонированный файл.
 * @returns {Function} - Функция, принимающая узел и возвращающая клонированный файл.
 */
export function cloneNodeAsFileFactory(
    project?: Project
): <Value extends SourceFile | Node<ts.Node>>(value: Value) => SourceFile {
    const currentProject = project || new Project();

    return <Value extends SourceFile | Node<ts.Node>>(value: Value): SourceFile => {
        /**
         * Создание клонированного и сохраненного в проекте файла на основе переданного узла.
         *
         * @param {Value} value - Узел, который будет клонирован в виде файла.
         * @returns {SourceFile} - Клонированный и сохраненный в проекте файл.
         */
        const copiedSourceFile = currentProject.createSourceFile(
            `${v4()}.tsx`,
            value.getFullText()
        );

        return copiedSourceFile;
    };
}
